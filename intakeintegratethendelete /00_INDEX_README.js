// importandintegrate / 00_INDEX_README.js
// Purpose: Single index for integrators. Each numbered file is a self-contained task.
// Order: Apply 01..06 (LIVE hardening), 07..10 (WS+dashboard), 11..12 (guards/CI), 13..14 (TRAI), 15 (ultdash).

module.exports = {
  order: [
    "01_no_rng_live_QNC_patch.js",
    "02_no_rng_spiking_patch.js",
    "03_execution_layer_live_only.js",
    "04_launcher_live_guards.js",
    "05_unified_core_live_guard.js",
    "06_disable_gan_live.js",
    "07_dashboard_ws_client_ultdash.js",
    "08_bot_ws_broadcast.js",
    "09_websocket_manager_singleton_usage.js",
    "10_nginx_ws_notes.js",
    "11_repo_grep_tasks.js",
    "12_hardmode_env_guard.js",
    "13_trai_ws_bridge.js",
    "14_trai_memory_loader.js",
    "15_dashboard_entry_switch.js"
  ]
};
