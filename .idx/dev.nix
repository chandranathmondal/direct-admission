{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
    pkgs.gnumake
    pkgs.ngrok
  ];
  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "start"
        ];
        manager = "web";
        env = {
          PORT = "$PORT";
        };
      };
    };
  };
}
