{
  description = "Flake utils demo";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
    dbmlSQLite = {
      url = "github:maix0/DBML_SQLite";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    dbmlSQLite,
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
            dbmlSQLite.packages.${system}.default

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
