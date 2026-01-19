class RemotePathParser {
  static parse(input) {
    // Handle Windows UNC paths: \\server\share\path
    if (input.startsWith('\\\\')) {
      const parts = input.slice(2).split('\\');
      return {
        protocol: 'smb',
        host: parts[0],
        share: parts[1],
        path: '/' + parts.slice(2).join('/'),
        port: 445,
        username: null,
        password: null
      };
    }

    // Handle URL-style paths
    try {
      const url = new URL(input);
      const protocol = url.protocol.replace(':', '');

      const result = {
        protocol,
        host: url.hostname,
        port: url.port ? parseInt(url.port) : this.getDefaultPort(protocol),
        path: decodeURIComponent(url.pathname),
        username: url.username ? decodeURIComponent(url.username) : null,
        password: url.password ? decodeURIComponent(url.password) : null
      };

      // SMB-specific: extract share from path
      if (protocol === 'smb') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        result.share = pathParts[0];
        result.path = '/' + pathParts.slice(1).join('/');
      }

      return result;
    } catch {
      // Not a valid URL, treat as local path
      return { protocol: 'local', path: input };
    }
  }

  static getDefaultPort(protocol) {
    const ports = {
      ssh: 22,
      sftp: 22,
      smb: 445,
      nfs: 2049
    };
    return ports[protocol] || null;
  }

  static isRemote(input) {
    return (
      input.startsWith('ssh://') ||
      input.startsWith('sftp://') ||
      input.startsWith('smb://') ||
      input.startsWith('nfs://') ||
      input.startsWith('\\\\')
    );
  }

  static buildUrl(config) {
    const { protocol, host, port, path, share } = config;

    if (protocol === 'smb') {
      const defaultPort = 445;
      const portPart = port && port !== defaultPort ? `:${port}` : '';
      return `smb://${host}${portPart}/${share}${path}`;
    }

    const defaultPort = this.getDefaultPort(protocol);
    const portPart = port && port !== defaultPort ? `:${port}` : '';
    return `${protocol}://${host}${portPart}${path}`;
  }
}

module.exports = { RemotePathParser };
