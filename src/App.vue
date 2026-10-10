<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
import RestTimer from './components/RestTimer.vue'
</script>

<template>
  <RouterView />
  <RestTimer />
  <BottomNav />
</template>
