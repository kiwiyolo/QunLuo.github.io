declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }

  function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: unknown,
  ): unknown;
}

