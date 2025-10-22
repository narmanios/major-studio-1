# Smithsonian Image Download

This project downloads images from the Smithsonian API using Node.js.

## Prerequisites

- Node.js installed
- Required packages: `request` and `dotenv`

```bash
npm install request dotenv
```

## Setup

1. Create a `.env` file with your Smithsonian API key:
```
API_KEY="your_api_key_here"
```

2. Add `.env` to your `.gitignore` to keep your API key private

## Steps

### 1. Prepare the JSON Data

First, fetch the metadata from the Smithsonian API:

```bash
node node_prepare_json.js
```

**Important:** This script has a 5-second timeout. If you have many items, you may need to increase the timeout in the code.

**Verify:** Check that `data.json` was created and contains your image metadata.

### 2. Create Downloads Directory

Before downloading, create the directory where images will be saved:

```bash
mkdir downloads
```

### 3. Download Images

Run the download script:

```bash
node node_download_images.js
```

## Important Notes

### Server Overload Prevention

⚠️ **The download script includes concurrency controls to prevent overwhelming the Smithsonian server.**

- **Concurrency Limit:** Only 2 images download simultaneously
- **Retry Logic:** Failed downloads retry automatically (up to 3 times)
- **Delays:** Small delays between requests prevent rate limiting

**Why this matters:** Downloading all images at once will trigger ECONNRESET errors and result in empty (0-byte) files. The script controls the download rate to avoid these issues.

### Troubleshooting

**Empty files (0 bytes)?**
- The server was overwhelmed
- Delete empty files: `rm downloads/*.jpg`
- Re-run the download script (it has concurrency control built-in)

**ECONNRESET errors?**
- Normal for a few images (they will auto-retry)
- If many fail, the retry logic will handle them
- Check your internet connection

**Missing data.json?**
- Run `node_prepare_json.js` first
- Check that your API key in `.env` is correct
- Verify the timeout is long enough for your query

## Output

The script shows progress as it downloads:
```
[1/183] Downloading FS-5461_07.jpg...
✓ Success: FS-5461_07.jpg (1/183)
```

When complete, you'll see a summary:
```
=== Download Complete ===
Success: 180
Errors: 3
Total: 183
```

All downloaded images are saved in the `downloads/` directory.
