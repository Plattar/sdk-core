import { Util } from './util';

export class DNS {
    private static readonly _DNSCache: Map<string, { status: boolean }> = new Map<string, { status: boolean }>();

    /**
     * Performs a DNS Check to the provided hostname to ensure it exists
     */
    public static check(hostname: string, forceRecheck: boolean = false): Promise<boolean> {
        return new Promise<boolean>((accept, _reject) => {
            // can only perform check in NodeJS Environments
            if (!Util.isNode()) {
                return accept(true);
            }

            if (!forceRecheck) {
                // get the previous cached hostname check
                const result = DNS._DNSCache.get(hostname);

                if (result) {
                    return accept(result.status);
                }
            }

            // otherwise, recheck and re-cache
            import('dns').then((dns) => {
                const url: URL = new URL(hostname);
                dns.lookup(url.hostname, (error) => {
                    const status: boolean = (error ? false : true);

                    DNS._DNSCache.set(hostname, { status: status });

                    accept(status);
                });
            }).catch((_err) => {
                DNS._DNSCache.set(hostname, { status: false });

                accept(false);
            });
        });
    }

    /**
     * resolves a localhost into a valid internal ip address
     */
    public static resolveLocalhost(hostname: string): Promise<string> {
        return new Promise<string>((accept, reject) => {
            if (!Util.isNode()) {
                return accept(hostname);
            }

            const url: URL = new URL(hostname);

            if (url.hostname !== 'localhost') {
                return accept(hostname);
            }

            // check if inside docker in lambda - use host.docker.internal if so
            if (Util.isDocker()) {
                return accept(`${url.protocol}//${'host.docker.internal'}${(url.port !== '' ? `:${url.port}` : '')}${(url.pathname !== '/' ? url.pathname : '')}`);
            }

            // resolve localhost to an ip-address
            // this is needed for example in docker environments
            import('os').then((os) => {
                const nets: any = os.networkInterfaces();
                const results: any = {};

                for (const name of Object.keys(nets)) {
                    for (const net of nets[name]) {
                        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;

                        if (net.family === familyV4Value && !net.internal) {
                            if (!results[name]) {
                                results[name] = [];
                            }

                            results[name].push(net.address);
                        }
                    }
                }

                const result = results.en0 && results.en0.length > 0 ? results.en0[0] : null;

                if (!result) {
                    return accept(hostname);
                }

                return accept(`${url.protocol}//${result}${(url.port !== '' ? `:${url.port}` : '')}${(url.pathname !== '/' ? url.pathname : '')}`);
            }).catch((_err) => {
                accept(hostname);
            });
        });
    }
}