# калькулятор цен

## как запустить:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cd interfaces/frontend && npm install && npm run build && cd ../..
python main.py
```

По умолчанию: `http://127.0.0.1:8000`
