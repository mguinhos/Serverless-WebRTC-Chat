from os import path

from flask import Flask

from flask import redirect, send_from_directory

app = Flask(__name__, static_url_path='')

@app.route('/')
def index():
    return redirect('index.html')

@app.route('/modules/<filepath>')
def module(filepath: str):
    if filepath.endswith('.js'):
        return send_from_directory('static/modules', filepath, mimetype='text/javascript')

    return send_from_directory('static/modules', filepath + '.js', mimetype='text/javascript')

if __name__ == '__main__':
    app.run('0.0.0.0', port=8888, debug=True)