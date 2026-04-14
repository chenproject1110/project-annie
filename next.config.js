/**
 * exFAT returns EISDIR from readlink() on regular files instead of EINVAL.
 * Monkey-patch every readlink surface so webpack/Next.js treat the error as
 * "not a symlink" (EINVAL) rather than crashing.
 */
;(function patchExfatReadlink() {
  const fs = require('fs');

  const wrap = (orig) =>
    function (...args) {
      const cb = args[args.length - 1];
      if (typeof cb === 'function') {
        args[args.length - 1] = (err, val) => {
          if (err && err.code === 'EISDIR') { err.code = 'EINVAL'; err.errno = -4071; }
          cb(err, val);
        };
        return orig.apply(this, args);
      }
      return orig.apply(this, args);
    };

  const wrapSync = (orig) =>
    function (...args) {
      try { return orig.apply(this, args); }
      catch (err) {
        if (err && err.code === 'EISDIR') { err.code = 'EINVAL'; err.errno = -4071; }
        throw err;
      }
    };

  fs.readlink = wrap(fs.readlink);
  fs.readlinkSync = wrapSync(fs.readlinkSync);
  if (fs.promises) {
    const origP = fs.promises.readlink;
    fs.promises.readlink = async function (...args) {
      try { return await origP.apply(this, args); }
      catch (err) {
        if (err && err.code === 'EISDIR') { err.code = 'EINVAL'; err.errno = -4071; }
        throw err;
      }
    };
  }

  try {
    const gfs = require('graceful-fs');
    gfs.readlink = wrap(gfs.readlink);
    gfs.readlinkSync = wrapSync(gfs.readlinkSync);
    if (typeof gfs.gracefulify === 'function') gfs.gracefulify(fs);
  } catch (_) {}
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
}

module.exports = nextConfig
