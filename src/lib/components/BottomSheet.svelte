<script>
  import { onMount } from 'svelte';
  let { ariaLabel = 'Open panel' } = $props();
  let open = $state(false);

  function toggle() { open = !open; }

  onMount(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(max-width: 767px)');
        if (mq.matches) open = true;
      }
    } catch (e) {
      // ignore
    }
  });
</script>

<div class="bsheet" class:open={open} role="region" aria-label={ariaLabel}>
  <button class="bsheet-handle" onclick={toggle} aria-expanded={open} aria-label={ariaLabel}>
    <span class="handle-bar"></span>
    <span class="bsheet-label"><slot name="label" /></span>
    <span class="bsheet-toggle">{open ? '▼' : '▲'}</span>
  </button>

  <div class="bsheet-content" aria-hidden={!open}>
    <slot />
  </div>
</div>

<style>
  .bsheet { position: relative; }

  /* Mobile: fixed bottom sheet */
  @media (max-width: 767px) {
    .bsheet {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1400;
      pointer-events: auto;
      display: block;
      transition: transform 280ms cubic-bezier(.2,.8,.2,1), box-shadow 200ms ease;
      transform: translateY(calc(100% - 44px));
      will-change: transform;
    }
    .bsheet.open { transform: translateY(0); box-shadow: 0 -10px 30px rgba(0,0,0,0.35); }

    .bsheet-handle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 12px;
      background: var(--surface);
      border-top: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      backdrop-filter: blur(6px);
    }
    .handle-bar { width: 36px; height: 4px; background: var(--text-dim); border-radius: 4px; display:inline-block; }
    .bsheet-label { flex: 1; text-align: left; font-size: 13px; font-weight: 600; color: var(--text); margin-left: 8px; }
    .bsheet-toggle { margin-left: 8px; font-size: 12px; color: var(--text-dim); }

    .bsheet-content {
      height: 60vh;
      overflow-y: scroll;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y;
      overscroll-behavior-y: contain;
      background: var(--surface);
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      padding: 8px 12px 20px;
    }
    .bsheet-handle { touch-action: none; }
  }

  /* Desktop: behave as an ordinary container (use DestinationPanel's desktop rules) */
  @media (min-width: 768px) {
    .bsheet { position: absolute; right: 0; top: 0; bottom: 0; width: 360px; }
    .bsheet-handle { display: none; }
    .bsheet-content { height: 100%; overflow: auto; padding: 0; }
  }
</style>
