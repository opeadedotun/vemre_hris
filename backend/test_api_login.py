import requests
import sys

def test_api_login():
    url = "http://127.0.0.1:8000/api/auth/token/"
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api_login()
