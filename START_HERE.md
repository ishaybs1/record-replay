# How to Run from Scratch

## Quick Start (One Command)

Open a terminal and run:

```bash
cd /home/ishay/Desktop/record-os
./run-with-tracee.sh
```

When prompted for sudo password, **enter your password**.

You should see:
```
✅ Tracee + WebSocket server running
✅ Dev server running
🌐 Local: http://localhost:8080
```

Then:
1. Open your browser to **http://localhost:8080**
2. Click **"▶ Start Recording (Real Tracee)"**
3. Run some commands (e.g., `echo "test" > test.txt`)
4. Click **"⏹ Stop Recording"**
5. Check your **Downloads folder** for the file!

Press **Ctrl+C** in the terminal to stop everything.

---

## What Was Fixed

The original script had wrong Tracee syntax:
- ❌ Old: `--output format:json` (doesn't work)
- ✅ New: `-o json` (correct syntax)

Now Tracee will actually capture events!

---

## Verify It's Working

### Check 1: Events are being captured
In another terminal:
```bash
tail -f /tmp/tracee/trace.ndjson
```

You should see JSON events appearing!

### Check 2: File has data
```bash
ls -lh /tmp/tracee/trace.ndjson
```

Should show file size growing (not 0 bytes).

### Check 3: Processes are running
```bash
ps aux | grep -E "(tracee|websocat)" | grep -v grep
```

You should see both tracee and websocat processes.

---

## Test Recording

1. Start the app: `./run-with-tracee.sh`
2. Open browser: http://localhost:8080
3. Click "▶ Start Recording"
4. In another terminal, run:
   ```bash
   echo "hello" > /tmp/test.txt
   cat /tmp/test.txt
   rm /tmp/test.txt
   ```
5. Click "⏹ Stop Recording"
6. You'll see an alert with filename and event count
7. Check `~/Downloads/` for the file: `os-activity-*.txt`

---

## Troubleshooting

### Problem: "No events captured!"
**Solution:** Tracee isn't running. Make sure you entered sudo password when starting the script.

### Problem: Script doesn't ask for sudo password
**Solution:** Run the script directly in your terminal (not through an IDE or background process).

### Problem: Port 8080 already in use
**Solution:** The script will kill old processes automatically, or run:
```bash
pkill -f vite
```

### Problem: File is empty (0 bytes)
**Solution:** Check if tracee process is actually running:
```bash
sudo ps aux | grep tracee | grep -v grep
```

If nothing shows up, Tracee didn't start.

---

## Files in This Directory

- `run-with-tracee.sh` - Main script to run everything (USE THIS)
- `start-tracee-FIXED.sh` - Alternative: Start only Tracee+WebSocket
- `package.json` - Node.js dependencies
- `src/` - React application source code

---

## What Gets Captured

The app captures these kernel events:
- **execve** - Program execution
- **openat, openat2, open** - File opens
- **write** - File writes
- **close** - File closes
- **read** - File reads

Events are displayed in real-time and saved to a text file when you stop recording.

---

## Need Help?

Check the browser console (F12 → Console) for debug messages showing:
- How many events were captured
- WebSocket connection status
- File save confirmation

The debugging added earlier will show alerts and console logs to help identify any issues.
