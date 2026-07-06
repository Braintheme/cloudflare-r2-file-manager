# Cloudflare R2 File Manager

`cloudflare-r2-file-manager` is a full-stack web application for managing files and folders stored in Cloudflare R2. It provides both a modern web interface and REST API for performing CRUD operations on files and folders within your R2 bucket.

## ✨ Features

### 🖥️ Web Interface

- **Modern UI**: Clean, responsive web interface built with HTML5, Tailwind CSS, and Alpine.js
- **File Browser**: Navigate folders with breadcrumb navigation
- **Multi-Select**: Advanced file selection with Shift+Click range selection, Ctrl+A, and Esc to clear
- **Drag & Drop**: Intuitive file and folder upload interface
- **Real-time Feedback**: Toast notifications and progress indicators

### 📁 File Management

- **Create** JSON files and folders
- **Read** and **update** file contents
- **Delete** single files or multiple files in batch
- **Upload** multiple files (up to 50 per request) with progress tracking
- **Folder Upload**: Upload entire directory structures while preserving hierarchy
- **Batch Operations**: Delete multiple files in a single request

### 🔧 Advanced Features

- **Natural Sorting**: Proper alphanumeric sorting for files and folders
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Responsive Design**: Mobile-friendly interface
- **Progress Tracking**: Real-time upload progress with visual indicators
- **Error Handling**: Comprehensive error handling with user-friendly messages

### 🌐 API Endpoints

- RESTful API for all file operations
- Pre-signed URL generation for secure file access
- Batch operations for improved performance
- CORS support for web applications

## Prerequisites

- Node.js (v18 or above)
- pnpm (`npm install -g pnpm` or `corepack enable`)
- Cloudflare R2 account and API credentials

## Setup

1. **Clone the repository:**

    ```bash
    https://github.com/YsrajSingh/cloudflare-r2-file-manager.git
    cd cloudflare-r2-file-manager
    ```

2. **Install dependencies:**

    ```bash
    pnpm install
    ```

3. **Create your `.env`** from the template and fill in your values:

    ```bash
    cp env.dist .env
    ```

    ```bash
    PORT=3005
    AWS_ACCESS_KEY_ID=<your-r2-access-key>
    AWS_SECRET_ACCESS_KEY=<your-r2-secret-key>
    R2_BUCKET_NAME=<your-bucket>
    R2_BUCKET=<your-bucket>
    R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

    # Public base for download links (used by the "copy link" button)
    PUBLIC_DOWNLOAD_BASE=https://dl.example.com/download

    # Deploy target (used by `pnpm run deploy`)
    DEPLOY_HOSTNAME=root@203.0.113.10
    DEPLOY_DESTINATION=/var/www/storage.example.com
    DEPLOY_SERVICE=r2-manager
    DEPLOY_OWNER=www-data:www-data
    ```

## Running the Server

To start the server, run:

```bash
pnpm start
```

The server will be available at `http://localhost:3005`

## What's different in this fork

- **Public download links** — a `GET /download/*` route streams objects straight from R2, so the raw R2 URL and presigned signatures are never exposed. The **copy-link** button copies `PUBLIC_DOWNLOAD_BASE/<key>` instead of a presigned URL.
- **Environment-driven config** — all settings live in `.env` (see `env.dist`), including `PUBLIC_DOWNLOAD_BASE` and the deploy target.
- **pnpm** — the project uses pnpm (pinned via the `packageManager` field); `.npmrc` sets `node-linker=hoisted` so the deployed `node_modules` is self-contained.
- **One-command deploy** — `pnpm run deploy` rsyncs the project and restarts the service (see below).

## Deployment

Deployment uses `gulp-rsync` (see `gulpfile.js`) and is configured entirely via the `DEPLOY_*` variables in `.env`:

```bash
pnpm run deploy
```

> Use `pnpm run deploy` (with `run`) — `pnpm deploy` is a built-in pnpm command and will not run this script.

This uploads the project via rsync, runs `pnpm install --prod` on the server, fixes ownership and restarts the `DEPLOY_SERVICE` systemd unit. `node_modules`, `.git`, `gulpfile.js` and `env.dist` are excluded from the upload.

## Web Interface

Once the server is running, visit `http://localhost:3005` in your browser to access the web interface:

### Features:
- **File Browser**: Navigate through your folders with breadcrumb navigation
- **Multi-Select**: Select multiple files with Shift+Click range selection, Ctrl+A, or individual clicks
- **File Operations**: Create, upload, delete, and manage files and folders
- **Folder Upload**: Upload entire directory structures while preserving hierarchy
- **Batch Operations**: Delete multiple files efficiently in single requests
- **Progress Tracking**: Real-time upload progress with visual indicators
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Full keyboard navigation support

### Usage:
1. **Navigation**: Click on folders to navigate, use breadcrumbs to go back
2. **File Selection**: Click files to select, Shift+Click for ranges, Ctrl+A for all
3. **Upload**: Use "Upload" button to select files or drag & drop folders
4. **Delete**: Select files and click "Delete" for batch deletion
5. **Create**: Use "New Folder" or "New File" buttons to create content

## API Endpoints

1. **Create a File**

- Endpoint: `POST /create-file`
- Request Body:

    ```json
    {
        "folder": "folder-name",
        "fileName": "file.json",
        "content": { "key": "value" }
    }
    ```

2. **Delete a File**

- Endpoint: `DELETE /delete-file`
- Request Body (single file):

    ```json
    {
        "folder": "folder-name",
        "fileName": "file.json"
    }
    ```

- Request Body (batch delete multiple files):

    ```json
    {
        "folder": "folder-name",
        "fileNames": ["file1.json", "file2.json", "file3.json"]
    }
    ```

- Request Body (delete all files in folder):

    ```json
    {
        "folder": "folder-name",
        "fileName": "*"
    }
    ```

- Response: `{"message": "Deleted X files successfully"}` or `{"message": "Deleted X files successfully, Y files failed", "deleted": X, "failed": Y, "errors": [...]}`

3. **Update a File**

- Endpoint: `PUT /update-file`
- Request Body:

    ```json
    {
        "folder": "folder-name",
        "fileName": "file.json",
        "content": { "key": "updated-value" }
    }
    ```

4. **Read a File**

- Endpoint: `GET /read-file`
- Query Parameters: `folder=folder-name&fileName=file.json`

5. **List Files in a Folder**

- Endpoint: `GET /list-files`
- Query Parameters: `folder=folder-name`

6. **List All Folders**

- Endpoint: `GET /list-folders`

7. **Duplicate a Folder**

- Endpoint: `POST /duplicate-folder`
- Request Body:

    ```json
    {
        "sourceFolder": "source-folder",
        "targetFolder": "target-folder"
    }
    ```

8. **Rename a Folder**

- Endpoint: `PUT /rename-folder`
- Request Body:

    ```json
    {
        "sourceFolder": "old-folder-name",
        "targetFolder": "new-folder-name"
    }
    ```

9. **Upload Files**

- Endpoint: `POST /upload-files`
- Content-Type: `multipart/form-data`
- Form Data:
  - `files`: Multiple files (up to 50 per request, processed in batches of 10)
  - `folder`: Target folder name (optional, defaults to "uploads")
- Response: `{"message": "Files uploaded successfully", "fileNames": ["file1.jpg", "file2.png"]}`

10. **Get File URLs**

- Endpoint: `GET /get-file-urls`
- Query Parameters: `folder=folder-name&expires=3600` (expires is optional)
- Returns pre-signed URLs for all files in the specified folder

## Contributing

1. Fork the repository.
1. Create a new branch (`git checkout -b feature-name`).
1. Commit your changes (`git commit -am 'Add new feature'`).
1. Push to the branch (`git push origin feature-name`).
1. Create a new pull request.

## License

This project is licensed under the [MIT License](https://github.com/YsrajSingh/cloudflare-r2-file-manager/blob/main/LICENSE).
