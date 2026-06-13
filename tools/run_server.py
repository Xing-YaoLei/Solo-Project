import http.server
import socketserver
import mimetypes
import os

PORT = 8081

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def guess_type(self, path):
        mimetype, encoding = mimetypes.guess_type(path)
        if path.endswith('.wasm'):
            return 'application/wasm'
        if path.endswith('.pck'):
            return 'application/octet-stream'
        return mimetype

os.chdir('/Users/yaoleyxing/Developer/solo-mange-pro/MP0020/build/web')

with socketserver.TCPServer(('', PORT), MyHTTPRequestHandler) as httpd:
    print(f'Server running at http://localhost:{PORT}')
    print(f'Serving from: {os.getcwd()}')
    httpd.serve_forever()
