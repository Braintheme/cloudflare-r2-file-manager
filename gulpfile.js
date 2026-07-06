const { src, series } = require("gulp");
const rsync = require("gulp-rsync");
const { exec } = require("child_process");
const fs = require("fs");
require("dotenv").config();

// Deploy settings come from .env (see env.dist)
const HOSTNAME = process.env.DEPLOY_HOSTNAME;
const DESTINATION = process.env.DEPLOY_DESTINATION;
const SERVICE = process.env.DEPLOY_SERVICE;
const OWNER = process.env.DEPLOY_OWNER || "www-data:www-data";

// Local dir with nginx site configs -> /etc/nginx/sites-available
const NGINX_DIR = "deploy/nginx";

// Fail early if required settings are missing
function checkConfig(cb) {
    const missing = [];
    if (!HOSTNAME) missing.push("DEPLOY_HOSTNAME");
    if (!DESTINATION) missing.push("DEPLOY_DESTINATION");
    if (!SERVICE) missing.push("DEPLOY_SERVICE");
    if (missing.length) {
        return cb(new Error(`Missing in .env: ${missing.join(", ")}. Copy env.dist to .env.`));
    }
    cb();
}

// Upload project files to the server via rsync
function upload() {
    return src(["./**", "!./node_modules/**", "!./.git/**", "!./deploy/**"], { dot: true })
        .pipe(
            rsync({
                root: "./",
                hostname: HOSTNAME,
                destination: DESTINATION,
                recursive: true,
                archive: true,
                compress: true,
                silent: false,
                // clean: true, // mirror copy, deletes extra files on the server
                exclude: [
                    "node_modules",
                    ".git",
                    "deploy",
                    "gulpfile.js",
                    "env.dist",
                    "**/*.log",
                    "**/.DS_Store"
                ]
            })
        );
}

// Install deps, fix ownership and restart the service on the server
function restart(cb) {
    const remote = [
        `cd ${DESTINATION}`,
        `pnpm install --prod --frozen-lockfile`,
        `chown -R ${OWNER} ${DESTINATION}`,
        `[ -f ${DESTINATION}/.env ] && chmod 600 ${DESTINATION}/.env`,
        `systemctl restart ${SERVICE}`,
        `systemctl is-active ${SERVICE}`
    ].join(" && ");

    exec(`ssh -o BatchMode=yes ${HOSTNAME} "${remote}"`, (err, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        cb(err);
    });
}

// Upload nginx site configs to /etc/nginx/sites-available
function uploadNginx() {
    return src(`${NGINX_DIR}/*`).pipe(
        rsync({
            root: `${NGINX_DIR}/`,
            hostname: HOSTNAME,
            destination: "/etc/nginx/sites-available/",
            recursive: true,
            silent: false
        })
    );
}

// Enable the sites, test config, reload nginx (reload only if the test passes)
function reloadNginx(cb) {
    const sites = fs.readdirSync(NGINX_DIR).filter((f) => !f.startsWith("."));
    const link = sites
        .map((s) => `ln -sf ../sites-available/${s} /etc/nginx/sites-enabled/${s}`)
        .join(" && ");
    const remote = `${link} && nginx -t && systemctl reload nginx && echo "nginx reloaded"`;

    exec(`ssh -o BatchMode=yes ${HOSTNAME} "${remote}"`, (err, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        cb(err);
    });
}

// nginx config only
exports.deployNginx = series(checkConfig, uploadNginx, reloadNginx);

// full deploy: app + nginx
exports.deploy = series(checkConfig, upload, restart, uploadNginx, reloadNginx);
exports.default = exports.deploy;
