<script setup lang="ts">
import Message from '../../message/Message.vue';

defineProps<{ canvasWidth: string }>();

</script>

<template>
  <Message :canvas-width="canvasWidth" />
</template>

<style scoped>

</style>
