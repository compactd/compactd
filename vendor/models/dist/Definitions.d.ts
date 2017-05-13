export declare type URI<K extends RouteParams> = string;
export interface RouteParams {
    [key: string]: (string | number | boolean);
}
export interface Document {
    [key: string]: (string | number | boolean | Document[]);
}
/**
 * Create a URI from a document properties
 * @param the props to build the URI from
 * @return the URI
 */
export declare type RouteCreator<K extends RouteParams> = (props: K) => string;
/**
 * Parses a URI and returns the props
 * @param uri the URI to parse
 * @return the params parsed from URI
 */
export declare type RouteParser<K extends RouteParams> = (uri: string) => K;
export declare type Route<K extends RouteParams> = (param: string | K) => any;
/**
 * Creates a Route which is a function that either parse or stringify object/string
 * @param route the route uri
 * @return the Route
 */
export declare type RouteFactory<K extends RouteParams> = (route: string) => Route<K>;
export interface DocURI<K extends RouteParams> {
    route: RouteFactory<K>;
}
