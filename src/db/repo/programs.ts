import { db } from '../db'
import type { Program, ProgramPhase } from '../types'

export function allPrograms() {
  return db.programs.toArray()
}

export function getProgram(id: string) {
  return db.programs.get(id)
}

export function findPhase(program: Program | undefined, phaseId: string): ProgramPhase | undefined {
  return program?.phases.find((p) => p.id === phaseId)
}
