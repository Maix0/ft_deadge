{
  description = "Flake utils demo";

  inputs.nixpkgs.url = "github:nixos/nixpkgs";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShell = pkgs.mkShellNoCC {
          packages = with pkgs; [
            podman
            podman-compose
            gnumake
            nodejs_24
            pnpm
            typescript
            
            # allow building better-sqlite3
            clang
          ];
          shellHook = ''
            export PODMAN_COMPOSE_WARNING_LOGS="false";
          '';
        };
      }
    );
}
