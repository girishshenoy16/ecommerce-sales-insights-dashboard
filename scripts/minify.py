import os
import re

def minify_css(css_content):
    # Remove comments
    css = re.sub(r'/\*[\s\S]*?\*/', '', css_content)
    # Remove multiple spaces/newlines
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([\{\}:;\,])\s*', r'\1', css)
    # Clean up trailing semicolons
    css = css.replace(';}', '}')
    return css.strip()

def minify_js(js_content):
    # Remove single line comments
    js = re.sub(r'//.*', '', js_content)
    # Remove multi-line comments
    js = re.sub(r'/\*[\s\S]*?\*/', '', js_content)
    # Basic space simplification
    # (Note: we don't do full obfuscation to keep it readable, but we strip comments and consolidate whitespace)
    lines = []
    for line in js.splitlines():
        cleaned = line.strip()
        if cleaned:
            lines.append(cleaned)
    return '\n'.join(lines)

def run_minification():
    css_path = "docs/css/style.css"
    js_path = "docs/js/script.js"
    
    print("--------------------------------------------------")
    print("Starting Asset Minification...")
    print("--------------------------------------------------")
    
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            content = f.read()
        minified = minify_css(content)
        # Note: We save a minified version or replace.
        # Let's save it directly to docs/css/style.css to optimize pages loading!
        with open(css_path, "w", encoding="utf-8") as f:
            f.write(minified)
        print(f"Minified {css_path} successfully!")
        
    if os.path.exists(js_path):
        with open(js_path, "r", encoding="utf-8") as f:
            content = f.read()
        minified = minify_js(content)
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(minified)
        print(f"Minified {js_path} successfully!")
        
    print("--------------------------------------------------")
    print("Asset Minification Completed Successfully!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    run_minification()
