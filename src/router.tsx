import { createHashRouter } from 'react-router'
import App from './App'
import Home from './routes/Home'
import WorkoutTab from './routes/WorkoutTab'
import ActiveWorkout from './routes/ActiveWorkout'
import WorkoutDetail from './routes/WorkoutDetail'
import WorkoutEdit from './routes/WorkoutEdit'
import History from './routes/History'
import Profile from './routes/Profile'
import Exercises from './routes/Exercises'
import ExerciseDetail from './routes/ExerciseDetail'
import ExerciseEdit from './routes/ExerciseEdit'
import RoutineEdit from './routes/RoutineEdit'
import Programs from './routes/Programs'
import KeyLifts from './routes/KeyLifts'
import Measures from './routes/Measures'
import Settings from './routes/Settings'
import DataSettings from './routes/DataSettings'

export const router = createHashRouter([
  {
    path: '/',
    Component: App,
    children: [
      { index: true, Component: Home },
      { path: 'workout', Component: WorkoutTab },
      { path: 'workout/active', Component: ActiveWorkout },
      { path: 'workouts/:id', Component: WorkoutDetail },
      { path: 'workouts/:id/edit', Component: WorkoutEdit },
      { path: 'history', Component: History },
      { path: 'profile', Component: Profile },
      { path: 'exercises', Component: Exercises },
      { path: 'exercises/new', Component: ExerciseEdit },
      { path: 'exercises/:id', Component: ExerciseDetail },
      { path: 'exercises/:id/edit', Component: ExerciseEdit },
      { path: 'routines/new', Component: RoutineEdit },
      { path: 'routines/:id/edit', Component: RoutineEdit },
      { path: 'programs', Component: Programs },
      { path: 'key-lifts', Component: KeyLifts },
      { path: 'measures', Component: Measures },
      { path: 'settings', Component: Settings },
      { path: 'settings/data', Component: DataSettings },
    ],
  },
])
