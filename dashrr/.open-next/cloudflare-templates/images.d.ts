export type RemotePattern = {
    protocol?: "http" | "https";
    hostname: string;
    port?: string;
    pathname: string;
    search?: string;
};
export type LocalPattern = {
    pathname: string;
    search?: string;
};
/**
 * Fetches an images.
 *
 * Local images (starting with a '/' as fetched using the passed fetcher).
 * Remote images should match the configured remote patterns or a 404 response is returned.
 */
export declare function fetchImage(fetcher: Fetcher | undefined, imageUrl: string): Response | Promise<Response> | undefined;
export declare function matchRemotePattern(pattern: RemotePattern, url: URL): boolean;
export declare function matchLocalPattern(pattern: LocalPattern, url: URL): boolean;
declare global {
    var __IMAGES_REMOTE_PATTERNS__: RemotePattern[];
    var __IMAGES_LOCAL_PATTERNS__: LocalPattern[];
}
