# Office Network Access Guide

Follow these steps to allow other staff members to access the HRIS application from their own devices on the same office network.

## 1. Identify Host IP Address
On the computer hosting the application:
1. Open PowerShell/Command Prompt.
2. Run `ipconfig`.
3. Look for "IPv4 Address" (e.g., `192.168.1.15`). This is your **HOST_IP**.

## 2. Configure Backend
In `backend/backend/settings.py`, add the HOST_IP to `ALLOWED_HOSTS`:
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'HOST_IP']
```

## 3. Configure Frontend
In the `frontend` folder, update `.env`:
```env
VITE_API_URL=http://HOST_IP:8000/v1
```

## 4. Launch Servers
Start the servers to listen on the local network:

### Backend
```bash
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
npm run dev -- --host
```

## 5. Staff Access
Other staff can now open their browser and visit:
`http://HOST_IP:5173`

---
> [!IMPORTANT]
> Ensure the Host computer's firewall allows incoming connections on ports **8000** and **5173**.
> You may need to create an "Inbound Rule" in Windows Defender Firewall.
