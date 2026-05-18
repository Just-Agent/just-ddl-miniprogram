#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, os
from pathlib import Path

DEFAULT_IGNORES = {'.git', '.idea', '.vscode', 'node_modules', 'cloudfunctions', 'dist', 'build', 'coverage', '__pycache__', 'miniprogram_npm'}
ASSET_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.mp3', '.ttf', '.woff', '.woff2'}

def human_size(num: int) -> str:
    value = float(num)
    for unit in ['B', 'KB', 'MB', 'GB']:
        if value < 1024 or unit == 'GB':
            return f'{value:.2f} {unit}' if unit != 'B' else f'{int(value)} B'
        value /= 1024
    return f'{value:.2f} GB'

def iter_files(base: Path, ignores: set[str]):
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in ignores and not d.startswith('.')]
        for filename in filenames:
            if filename in ignores or filename.startswith('.'):
                continue
            yield Path(dirpath) / filename

def load_app_json(root: Path):
    for candidate in [root / 'miniprogram' / 'app.json', root / 'app.json', root / 'src' / 'app.json']:
        if candidate.exists():
            return candidate, json.loads(candidate.read_text(encoding='utf-8'))
    raise FileNotFoundError('Cannot find app.json in project root, miniprogram/, or src/.')

def collect(mp_root: Path, app: dict, ignores: set[str]):
    subpackages = app.get('subpackages') or app.get('subPackages') or []
    roots = [pkg.get('root', '').strip('/') for pkg in subpackages if pkg.get('root')]
    report = {'main': {'bytes': 0, 'files': []}, 'subpackages': {r: {'bytes': 0, 'files': []} for r in roots}, 'large_files': [], 'asset_files': []}
    def pkg_for(rel: str):
        for r in roots:
            if rel == r or rel.startswith(r + '/'):
                return r
        return None
    for path in iter_files(mp_root, ignores):
        rel = path.relative_to(mp_root).as_posix()
        size = path.stat().st_size
        entry = {'path': rel, 'bytes': size, 'size': human_size(size)}
        pkg = pkg_for(rel)
        bucket = report['subpackages'][pkg] if pkg else report['main']
        bucket['bytes'] += size
        bucket['files'].append(entry)
        if size >= 100 * 1024:
            report['large_files'].append(entry)
        if path.suffix.lower() in ASSET_EXTS:
            report['asset_files'].append(entry)
    report['main']['size'] = human_size(report['main']['bytes'])
    for pkg in report['subpackages'].values():
        pkg['size'] = human_size(pkg['bytes'])
    report['large_files'].sort(key=lambda x: x['bytes'], reverse=True)
    report['asset_files'].sort(key=lambda x: x['bytes'], reverse=True)
    return report

def suggestions(report: dict, main_max: float, pkg_max: float):
    result = []
    main_limit = int(main_max * 1024 * 1024)
    pkg_limit = int(pkg_max * 1024 * 1024)
    if report['main']['bytes'] > main_limit:
        result.append(f'主包 {report["main"]["size"]} 超过 {main_max}MB：迁移非首屏页面到分包，压缩 assets，移除未使用组件。')
    elif report['main']['bytes'] > main_limit * 0.8:
        result.append(f'主包 {report["main"]["size"]} 接近 {main_max}MB：建议提前分包。')
    else:
        result.append(f'主包 {report["main"]["size"]} 当前安全。')
    for name, pkg in report['subpackages'].items():
        if pkg['bytes'] > pkg_limit:
            result.append(f'分包 {name} 为 {pkg["size"]}，超过 {pkg_max}MB：继续拆分或移出大资源。')
        elif pkg['bytes'] > pkg_limit * 0.8:
            result.append(f'分包 {name} 为 {pkg["size"]}，接近上限。')
    if report['large_files']:
        top = ', '.join(f'{f["path"]}({f["size"]})' for f in report['large_files'][:5])
        result.append(f'大文件 Top5：{top}。优先压缩或迁移到云存储/CDN。')
    return result

def print_md(project: Path, app_json: Path, report: dict, tips: list[str]):
    print('# 小程序分包体积分析\n')
    print(f'- 项目：`{project}`')
    print(f'- app.json：`{app_json}`')
    print(f'- 主包：**{report["main"]["size"]}** / {len(report["main"]["files"])} files')
    print('\n## 分包')
    if report['subpackages']:
        print('| 分包 | 体积 | 文件数 |')
        print('|---|---:|---:|')
        for name, pkg in report['subpackages'].items():
            print(f'| `{name}` | {pkg["size"]} | {len(pkg["files"])} |')
    else:
        print('未检测到 subpackages。建议把非首屏业务拆入分包。')
    print('\n## 建议')
    for tip in tips:
        print(f'- {tip}')
    print('\n## 大文件 Top 20')
    print('| 文件 | 体积 |')
    print('|---|---:|')
    for f in report['large_files'][:20]:
        print(f'| `{f["path"]}` | {f["size"]} |')

def main():
    parser = argparse.ArgumentParser(description='Analyze WeChat Mini Program package sizes.')
    parser.add_argument('project')
    parser.add_argument('--main-max', type=float, default=2.0)
    parser.add_argument('--pkg-max', type=float, default=2.0)
    parser.add_argument('--json-out')
    parser.add_argument('--ignore', action='append', default=[])
    args = parser.parse_args()
    project = Path(args.project).resolve()
    app_json, app = load_app_json(project)
    mp_root = app_json.parent
    report = collect(mp_root, app, DEFAULT_IGNORES | set(args.ignore))
    tips = suggestions(report, args.main_max, args.pkg_max)
    print_md(project, app_json, report, tips)
    if args.json_out:
        output = {'project': str(project), 'app_json': str(app_json), 'miniprogram_root': str(mp_root), 'report': report, 'suggestions': tips}
        Path(args.json_out).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'\nJSON report written to {args.json_out}')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
