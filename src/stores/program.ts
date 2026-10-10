import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Goal, Profile, Program, WeighIn } from '../types'
import { persist } from '../lib/db'
import { generatePlan, phaseOf, toISODate, weekInfo, GOALS } from '../lib/program'
import { dailyTargets, weightAdvice, weightTrend } from '../lib/body'
import { startOfWeek } from '../lib/util'
import { DEFAULT_AVAILABLE } from '../lib/schedule'
import { usePlan } from './plan'
import { useWorkouts } from './workouts'

export const defaultProgram = (): Program => ({
  goal: 'fatloss',
  phase: 1,
  startDate: toISODate(startOfWeek()),
  sessions: 4,
  available: [...DEFAULT_AVAILABLE],
  restDay: 2,
  maxMinutes: 60,
})

export const useProgram = defineStore('program', () => {
  const profile = ref<Profile>({ sex: 'na', age: null, height: null, activity: 'moderate' })
  const program = ref<Program | null>(defaultProgram())
  const weighIns = ref<WeighIn[]>([])
  const ready = Promise.all([persist('profile', profile), persist('program', program), persist('weighIns', weighIns)])

  const workouts = useWorkouts()

  const goal = computed(() => (program.value ? GOALS[program.value.goal] : null))
  const phase = computed(() => (program.value ? phaseOf(program.value.goal, program.value.phase) : null))
  const week = computed(() => (program.value ? weekInfo(program.value, workouts.workouts) : null))

  const sortedWeighIns = computed(() => [...weighIns.value].sort((a, b) => a.date.localeCompare(b.date)))
  const currentWeight = computed(() => sortedWeighIns.value[sortedWeighIns.value.length - 1]?.weight ?? null)
  const trend = computed(() => weightTrend(weighIns.value))
  const advice = computed(() => weightAdvice(program.value?.goal ?? 'health', trend.value))
  const targets = computed(() =>
    currentWeight.value ? dailyTargets(program.value?.goal ?? 'health', profile.value, trend.value?.average ?? currentWeight.value) : null,
  )

  function logWeight(date: string, weight: number, waist?: number | null) {
    weighIns.value = [...weighIns.value.filter((w) => w.date !== date), { date, weight, ...(waist ? { waist } : {}) }]
  }
  const removeWeight = (date: string) => (weighIns.value = weighIns.value.filter((w) => w.date !== date))

  /** Crea (o recrea) el programa y sustituye el plan semanal. */
  function apply(p: Program) {
    program.value = p
    usePlan().plan = generatePlan(p)
  }

  /** Pasa a la siguiente fase (regenera el plan con nuevos rangos y variantes). */
  function advancePhase() {
    if (!program.value) return
    apply({ ...program.value, phase: program.value.phase + 1, startDate: toISODate(startOfWeek()) })
  }

  /** Cambia solo el objetivo manteniendo los días. */
  const setGoal = (g: Goal) => program.value && apply({ ...program.value, goal: g, phase: 1, startDate: toISODate(startOfWeek()) })

  return { profile, program, weighIns, ready, goal, phase, week, sortedWeighIns, currentWeight, trend, advice, targets, logWeight, removeWeight, apply, advancePhase, setGoal }
})
