#!/usr/bin/env python3
"""
pack.py — 打包 + 更新服务器文件一键脚本
用法：python pack.py 1.2.0
"""
import sys, os, zipfile, re, shutil

def bump_version(path, new_ver):
    with open(path, 'r', encoding='utf-8') as f:
        data = f.read()
    data = re.sub(r'"version"\s*:\s*"[\d.]+"', f'"version": "{new_ver}"', data)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(data)

def pack_crx_zip(src_dir, out_zip):
    """打包为 .crx 兼容的 zip（Chrome 可识别）"""
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(src_dir):
            # 排除辅助文件
            dirs[:] = [d for d in dirs if d != '__pycache__']
            for fname in files:
                if fname in ('pack.py', 'generate_icons.py'):
                    continue
                fpath = os.path.join(root, fname)
                arcname = os.path.relpath(fpath, src_dir)
                zf.write(fpath, arcname)
    print(f'[OK] 已生成 {out_zip}')

def update_xml(xml_path, new_ver, ext_id, server_base):
    template = f"""<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='{ext_id}'>
    <updatecheck
      status='ok'
      version='{new_ver}'
      codebase='{server_base}/video-time-extension.crx'
    />
  </app>
</gupdate>
"""
    with open(xml_path, 'w', encoding='utf-8') as f:
        f.write(template)
    print(f'[OK] update.xml 已更新 → version={new_ver}')

if __name__ == '__main__':
    new_ver    = sys.argv[1] if len(sys.argv) > 1 else '1.1.0'
    ext_id     = input('Chrome 扩展 ID（chrome://extensions 页面可查）：').strip()
    server_base = input('服务器目录 URL（例：https://example.com/video-time-ext）：').strip()

    EXT_DIR  = 'video-time-extension'
    OUT_DIR  = 'server-files'
    XML_PATH = os.path.join(OUT_DIR, 'update.xml')
    CRX_PATH = os.path.join(OUT_DIR, 'video-time-extension.crx')

    os.makedirs(OUT_DIR, exist_ok=True)

    # 1. 更新 manifest.json 版本号 & update_url
    manifest = os.path.join(EXT_DIR, 'manifest.json')
    bump_version(manifest, new_ver)
    with open(manifest, 'r') as f:
        content = f.read()
    content = content.replace('https://YOUR_SERVER/video-time-ext',
                               server_base)
    with open(manifest, 'w') as f:
        f.write(content)
    print(f'[OK] manifest.json 版本更新 → {new_ver}')

    # 2. 打包 .crx（zip 格式，Chrome 接受）
    pack_crx_zip(EXT_DIR, CRX_PATH)

    # 3. 生成 update.xml
    update_xml(XML_PATH, new_ver, ext_id, server_base)

    print(f'\n=== 上传以下两个文件到服务器 {server_base}/ ===')
    print(f'  {CRX_PATH}')
    print(f'  {XML_PATH}')
    print('\n同事浏览器将在 1～5 小时内自动静默更新。')
