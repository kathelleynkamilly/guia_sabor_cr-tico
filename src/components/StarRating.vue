<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    rating?: number
    interactive?: boolean
    size?: 'sm' | 'md' | 'lg'
    showNumber?: boolean
  }>(),
  {
    modelValue: 0,
    rating: 0,
    interactive: false,
    size: 'md',
    showNumber: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const hoverValue = ref<number | null>(null)

function handleClick(star: number) {
  if (props.interactive) {
    emit('update:modelValue', star)
  }
}

function handleMouseEnter(star: number) {
  if (props.interactive) {
    hoverValue.value = star
  }
}

function handleMouseLeave() {
  if (props.interactive) {
    hoverValue.value = null
  }
}

function isStarActive(star: number): boolean {
  if (props.interactive && hoverValue.value !== null) {
    return star <= hoverValue.value
  }
  const current = props.interactive ? props.modelValue : props.rating
  return star <= Math.round(current)
}
</script>

<template>
  <div class="star-rating" :class="[`size-${size}`, { 'is-interactive': interactive }]">
    <div class="stars-group" @mouseleave="handleMouseLeave">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        class="star-btn"
        :class="{ active: isStarActive(star) }"
        :disabled="!interactive"
        :aria-label="`${star} estrelas`"
        @click="handleClick(star)"
        @mouseenter="handleMouseEnter(star)"
      >
        ★
      </button>
    </div>
    <span v-if="showNumber" class="rating-number">
      {{ (interactive ? modelValue : rating).toFixed(1) }}
    </span>
  </div>
</template>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.stars-group {
  display: inline-flex;
  gap: 0.15rem;
}

.star-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--stars-empty);
  line-height: 1;
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.star-btn.active {
  color: var(--stars);
}

.is-interactive .star-btn {
  cursor: pointer;
}

.is-interactive .star-btn:hover {
  transform: scale(1.2);
}

/* Tamanhos */
.size-sm .star-btn {
  font-size: 0.9rem;
}

.size-md .star-btn {
  font-size: 1.25rem;
}

.size-lg .star-btn {
  font-size: 1.8rem;
}

.rating-number {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text);
}
</style>
