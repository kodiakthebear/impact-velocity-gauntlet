/* IMPACT-EDIT: test-only hook for the legacy parity harness (tests/e2e/impact-parity.spec.js).
   Legacy exposes its state as window globals; Impact is a module, so the harness reads it here.
   Installed only when the URL has ?parity. */
export function installParityHook(read, actions){
  if(!new URLSearchParams(location.search).has('parity'))return;
  window.__iv={read:read,actions:actions};
}
