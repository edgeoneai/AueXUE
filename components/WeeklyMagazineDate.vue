<!--
  周刊杂志风格日期块（移植自上游 weekly-card-date）：
  WEEKLY MAGAZINE / ISSUE 序号 / 年月 / 日期数字 / 星期。
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  date?: string
  issue: number
}>()

const WEEKDAYS_CN = ['日', '一', '二', '三', '四', '五', '六']
const WEEKDAYS_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const MONTHS_EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

const parsed = computed(() => {
  const d = props.date ? new Date(props.date) : null
  if (!d || Number.isNaN(d.getTime()))
    return null
  return {
    year: d.getFullYear(),
    month: MONTHS_EN[d.getMonth()],
    day: String(d.getDate()).padStart(2, '0'),
    weekdayCn: WEEKDAYS_CN[d.getDay()],
    weekdayEn: WEEKDAYS_EN[d.getDay()],
    iso: d.toISOString(),
  }
})
</script>

<template>
  <aside class="weekly-mag-date" aria-label="发布日期">
    <time class="weekly-mag-date__time" :datetime="parsed?.iso">
      <span class="weekly-mag-date__brand">WEEKLY MAGAZINE</span>
      <span class="weekly-mag-date__issue-num">{{ String(issue).padStart(2, '0') }}</span>
      <span class="weekly-mag-date__issue-label">ISSUE</span>
      <template v-if="parsed">
        <span class="weekly-mag-date__year-bar">{{ parsed.year }} {{ parsed.month }}</span>
        <span class="weekly-mag-date__day-num">{{ parsed.day }}</span>
        <span class="weekly-mag-date__weekday">
          周{{ parsed.weekdayCn }} <span>{{ parsed.weekdayEn }}</span>
        </span>
      </template>
    </time>
  </aside>
</template>

<style lang="scss" scoped>
.weekly-mag-date {
  flex: none;
  width: 148px;
  padding: 1rem 0.75rem;
  border-right: 1px solid var(--sakura-color-divider, rgba(0, 0, 0, 0.12));
  text-align: center;

  &__time {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  &__brand {
    font-size: 0.5625rem;
    letter-spacing: 0.14em;
    opacity: 0.55;
  }

  &__issue-num {
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1;
    color: var(--va-c-primary);
    font-variant-numeric: tabular-nums;
  }

  &__issue-label {
    font-size: 0.5625rem;
    letter-spacing: 0.16em;
    opacity: 0.55;
  }

  &__year-bar {
    margin-top: 0.4rem;
    font-size: 0.625rem;
    letter-spacing: 0.08em;
    opacity: 0.7;
  }

  &__day-num {
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  &__weekday {
    font-size: 0.625rem;
    opacity: 0.7;

    span {
      display: block;
      font-size: 0.5rem;
      letter-spacing: 0.08em;
      opacity: 0.75;
    }
  }
}

@media (max-width: 720px) {
  .weekly-mag-date {
    display: none;
  }
}
</style>
