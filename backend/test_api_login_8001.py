import requests
import json

def test_api_login():
    url = "http://127.0.0.1:8001/api/auth/token/"
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api_login()
