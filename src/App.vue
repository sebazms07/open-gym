<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
import RestTimer from './components/RestTimer.vue'
import BodySprite from './components/BodySprite.vue'
</script>

<template>
  <BodySprite />
  <RouterView />
  <RestTimer />
  <BottomNav />
</template>
