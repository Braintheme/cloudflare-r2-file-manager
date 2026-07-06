const { src, series } = require("gulp");
const rsync = require("gulp-rsync");
const { exec } = require("child_process");
require("dotenv").config();

// Deploy settings come from .env (see env.dist)
const HOSTNAME = process.env.DEPLOY_HOSTNAME;
const DESTINATION = process.env.DEPLOY_DESTINATION;
const SERVICE = process.env.DEPLOY_SERVICE;
const OWNER = process.env.DEPLOY_OWNER || "www-data:www-data";

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
    return src(["./**", "!./node_modules/**", "!./.git/**"], { dot: true })
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
        `npm install --omit=dev --no-audit --no-fund`,
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

exports.deploy = series(checkConfig, upload, restart);
exports.default = exports.deploy;
