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
            }).catch((err) => {
                console.error("DNS.check - " + err);
                DNS._DNSCache.set(hostname, { status: false });

                accept(false);
            });
        });
    }
}