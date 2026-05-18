#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, os, re
from pathlib import Path

IGNORE_DIRS = {'.git', '.idea', '.vscode', 'node_modules', 'miniprogram_npm', 'dist', 'build', 'coverage', '__pycache__'}
TEXT_EXTS = {'.js', '.ts', '.json', '.wxml', '.wxss', '.wxs', '.md', '.yml', '.yaml', '.env', '.txt'}
SECRET_PATTERNS = [
    (re.compile(r'(?i)appsecret\s*[:=]\s*["\'][A-Za-z0-9_\-]{16,}["\']'), '疑似 AppSecret 入库'),
    (re.compile(r'(?i)(mch|merchant).{0,20}(private|key)\s*[:=]'), '疑似支付商户私钥配置入库'),
    (re.compile(r'-----BEGIN (?:RSA |EC |)PRIVATE KEY-----'), '私钥文件内容入库'),
    (re.compile(r'(?i)(upload|ci).{0,20}key\s*[:=]\s*["\'][A-Za-z0-9_\-]{20,}["\']'), '疑似上传密钥入库'),
]
DEPRECATED_PATTERNS = [
    (re.compile(r'wx\.getUserInfo\s*\('), '使用了不推荐作为新项目默认方案的 wx.getUserInfo'),
    (re.compile(r'open-type=["\']getUserInfo["\']'), '使用了旧式 open-type="getUserInfo"'),
]
SENSITIVE_API_PATTERNS = [
    (re.compile(r'wx\.getLocation\s*\('), '位置能力'),
    (re.compile(r'wx\.chooseMedia\s*\(|wx\.chooseImage\s*\('), '相册/媒体能力'),
    (re.compile(r'wx\.getClipboardData\s*\('), '剪贴板能力'),
    (re.compile(r'open-type=["\']getPhoneNumber["\']'), '手机号能力'),
    (re.compile(r'open-type=["\']chooseAvatar["\']|type=["\']nickname["\']'), '头像昵称能力'),
]
LEVEL_ORDER = {'BLOCKER': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'PASS': 4}


def human_size(num: int) -> str:
    value = float(num)
    for unit in ['B', 'KB', 'MB', 'GB']:
        if value < 1024 or unit == 'GB':
            return f'{value:.2f} {unit}' if unit != 'B' else f'{int(value)} B'
        value /= 1024
    return f'{value:.2f} GB'


def add(findings, level, code, message, file=None, suggestion=None):
    findings.append({'level': level, 'code': code, 'message': message, 'file': file, 'suggestion': suggestion})


def iter_text_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        for filename in filenames:
            path = Path(dirpath) / filename
            if path.suffix.lower() in TEXT_EXTS or filename.startswith('.env'):
                try:
                    text = path.read_text(encoding='utf-8')
                except UnicodeDecodeError:
                    continue
                yield path, text


def find_project(project: Path):
    candidates = [project / 'miniprogram' / 'app.json', project / 'app.json', project / 'src' / 'app.json']
    for app_json in candidates:
        if app_json.exists():
            return app_json.parent, app_json
    return None, None


def check_structure(project: Path, findings):
    mp, app_json = find_project(project)
    if not app_json:
        add(findings, 'BLOCKER', 'APP_JSON_MISSING', '未找到 app.json。', suggestion='确认项目根目录或 miniprogram/ 下存在 app.json。')
        return None, None, None
    try:
        app = json.loads(app_json.read_text(encoding='utf-8'))
    except json.JSONDecodeError as exc:
        add(findings, 'BLOCKER', 'APP_JSON_INVALID', f'app.json 不是合法 JSON：{exc}', str(app_json))
        return mp, app_json, None
    if not (project / 'project.config.json').exists():
        add(findings, 'BLOCKER', 'PROJECT_CONFIG_MISSING', '缺少 project.config.json。', suggestion='补充 project.config.json，配置 appid、miniprogramRoot、compileType。')
    if not (mp / 'sitemap.json').exists() and not app.get('sitemapLocation'):
        add(findings, 'LOW', 'SITEMAP_MISSING', '未检测到 sitemap.json 或 sitemapLocation。', str(app_json))
    for page in list(app.get('pages') or []):
        for ext in ['.js', '.json', '.wxml', '.wxss']:
            if not (mp / f'{page}{ext}').exists():
                add(findings, 'BLOCKER', 'PAGE_FILE_MISSING', f'app.json 页面 {page} 缺少 {ext} 文件。', str(mp / f'{page}{ext}'))
    for pkg in app.get('subpackages') or app.get('subPackages') or []:
        root = pkg.get('root', '').strip('/')
        for page in pkg.get('pages', []):
            full = f'{root}/{page}'
            for ext in ['.js', '.json', '.wxml', '.wxss']:
                if not (mp / f'{full}{ext}').exists():
                    add(findings, 'BLOCKER', 'SUBPACKAGE_PAGE_FILE_MISSING', f'分包页面 {full} 缺少 {ext} 文件。', str(mp / f'{full}{ext}'))
    if not (mp / 'utils' / 'request.js').exists():
        add(findings, 'MEDIUM', 'REQUEST_WRAPPER_MISSING', '缺少 utils/request.js。', suggestion='使用脚手架或 request-api Skill 生成统一请求层。')
    if not (mp / 'utils' / 'api.js').exists():
        add(findings, 'MEDIUM', 'API_MAP_MISSING', '缺少 utils/api.js。', suggestion='集中管理接口路径，避免页面硬编码 URL。')
    return mp, app_json, app


def check_code(project: Path, mp: Path | None, findings):
    has_privacy_helper = False
    has_content_check = False
    sensitive_hits = []
    for path, text in iter_text_files(project):
        rel = path.relative_to(project).as_posix()
        for pattern, msg in SECRET_PATTERNS:
            if pattern.search(text):
                add(findings, 'BLOCKER', 'SECRET_LEAK', msg, rel, '移出仓库，改用环境变量、GitHub Secrets、本机密钥文件或云端密钥管理。')
        for pattern, msg in DEPRECATED_PATTERNS:
            if pattern.search(text):
                add(findings, 'HIGH', 'DEPRECATED_USER_API', msg, rel, '头像使用 chooseAvatar，昵称使用 input type="nickname"，登录身份走 wx.login/云函数。')
        if 'getPrivacySetting' in text or 'requirePrivacyAuthorize' in text or 'openPrivacyContract' in text:
            has_privacy_helper = True
        if 'msgSecCheck' in text or 'imgSecCheck' in text or 'contentCheck' in rel:
            has_content_check = True
        if 'wx.request' in text and not rel.endswith('utils/request.js'):
            add(findings, 'HIGH', 'BARE_WX_REQUEST', '页面/组件/服务中发现裸 wx.request。', rel, '统一改为 utils/request.js，并把路径写入 utils/api.js。')
        for pattern, name in SENSITIVE_API_PATTERNS:
            if pattern.search(text):
                sensitive_hits.append((rel, name))
        if re.search(r'console\.(log|warn|error)\([^\n]*(phone|mobile|idcard|openid|unionid|token|address)', text, re.I):
            add(findings, 'MEDIUM', 'SENSITIVE_LOG', '疑似在日志中输出敏感字段。', rel, '生产日志需要脱敏，避免打印 token、手机号、地址、openid。')
    if sensitive_hits and not has_privacy_helper:
        files = ', '.join(sorted(set(f for f, _ in sensitive_hits))[:5])
        add(findings, 'HIGH', 'PRIVACY_FLOW_MISSING', f'检测到敏感能力但未发现隐私授权封装。涉及文件：{files}', suggestion='接入 utils/privacy.js 与 privacy-guard 组件，调用前说明用途并等待用户同意。')
    if not has_content_check:
        add(findings, 'MEDIUM', 'CONTENT_SAFETY_MISSING', '未检测到内容安全审核链路。', suggestion='UGC/评论/昵称/图片上传项目应接入 msgSecCheck/imgSecCheck 或人工审核状态机。')


def check_package_size(mp: Path | None, findings, main_max_mb: float):
    if not mp:
        return
    main = 0
    sub_roots = set()
    app_json = mp / 'app.json'
    if app_json.exists():
        try:
            app = json.loads(app_json.read_text(encoding='utf-8'))
            sub_roots = {pkg.get('root', '').strip('/') for pkg in (app.get('subpackages') or app.get('subPackages') or []) if pkg.get('root')}
        except Exception:
            pass
    for dirpath, dirnames, filenames in os.walk(mp):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        for filename in filenames:
            path = Path(dirpath) / filename
            size = path.stat().st_size
            rel = path.relative_to(mp).as_posix()
            if not any(rel == r or rel.startswith(r + '/') for r in sub_roots):
                main += size
            if size >= 500 * 1024:
                add(findings, 'MEDIUM', 'LARGE_FILE', f'检测到大文件 {human_size(size)}。', rel, '压缩图片/视频/字体，或迁移到云存储/CDN。')
    limit = int(main_max_mb * 1024 * 1024)
    if main > limit:
        add(findings, 'HIGH', 'MAIN_PACKAGE_TOO_LARGE', f'主包估算 {human_size(main)}，超过 {main_max_mb}MB。', suggestion='拆分低频页面到 subpackages，移出大资源。')
    elif main > limit * 0.8:
        add(findings, 'MEDIUM', 'MAIN_PACKAGE_NEAR_LIMIT', f'主包估算 {human_size(main)}，接近 {main_max_mb}MB。', suggestion='提前拆分包并压缩资源。')


def check_ci(project: Path, findings):
    workflows = project / '.github' / 'workflows'
    has_ci = workflows.exists() and any(p.suffix in {'.yml', '.yaml'} for p in workflows.iterdir())
    if not has_ci:
        add(findings, 'LOW', 'CI_MISSING', '未检测到 GitHub Actions 工作流。', suggestion='如需自动上传体验版，可参考 examples/github-actions/miniprogram-ci.yml。')
    for p in project.rglob('*'):
        if p.is_file() and p.suffix in {'.key', '.pem', '.p12'} and '.git' not in p.parts:
            add(findings, 'BLOCKER', 'KEY_FILE_IN_REPO', '检测到疑似密钥/证书文件。', p.relative_to(project).as_posix(), '密钥文件不得提交仓库。')


def summary(findings):
    counts = {k: 0 for k in ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW', 'PASS']}
    for item in findings:
        counts[item['level']] = counts.get(item['level'], 0) + 1
    status = 'PASS' if counts['BLOCKER'] == counts['HIGH'] == 0 else 'RISK'
    return {'status': status, 'counts': counts}


def print_markdown(project: Path, findings, summary_data):
    print('# 微信小程序项目审计报告\n')
    print(f'- 项目：`{project}`')
    print(f'- 状态：**{summary_data["status"]}**')
    print(f'- 统计：BLOCKER={summary_data["counts"].get("BLOCKER",0)} / HIGH={summary_data["counts"].get("HIGH",0)} / MEDIUM={summary_data["counts"].get("MEDIUM",0)} / LOW={summary_data["counts"].get("LOW",0)}')
    grouped = {}
    for item in sorted(findings, key=lambda x: (LEVEL_ORDER.get(x['level'], 9), x['code'], x.get('file') or '')):
        grouped.setdefault(item['level'], []).append(item)
    for level in ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW']:
        print(f'\n## {level}')
        items = grouped.get(level) or []
        if not items:
            print('- 无')
            continue
        for item in items:
            loc = f"（`{item['file']}`）" if item.get('file') else ''
            print(f"- [{item['code']}] {item['message']}{loc}")
            if item.get('suggestion'):
                print(f"  - 建议：{item['suggestion']}")


def main():
    parser = argparse.ArgumentParser(description='Audit a WeChat Mini Program project before release/review.')
    parser.add_argument('project')
    parser.add_argument('--json-out')
    parser.add_argument('--main-max', type=float, default=2.0)
    parser.add_argument('--strict', action='store_true', help='return non-zero when BLOCKER/HIGH exists')
    args = parser.parse_args()
    project = Path(args.project).resolve()
    findings = []
    mp, app_json, app = check_structure(project, findings)
    check_code(project, mp, findings)
    check_package_size(mp, findings, args.main_max)
    check_ci(project, findings)
    data = summary(findings)
    print_markdown(project, findings, data)
    output = {'project': str(project), 'summary': data, 'findings': findings}
    if args.json_out:
        Path(args.json_out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.json_out).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'\nJSON report written to {args.json_out}')
    if args.strict and (data['counts']['BLOCKER'] or data['counts']['HIGH']):
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
