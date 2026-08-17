// components/admin/QuestForm.tsx
// Create/edit form for a quest. Pass a `quest` to edit, omit it to create.
'use client'
import { useRef, useState } from 'react'
import { createQuest, updateQuest } from '@/app/admin/quests/actions'
import QuestQuestionEditor, { type QuestionDraft } from '@/components/admin/QuestQuestionEditor'
import {
  QUEST_TYPE_LABEL,
  type QuestType,
  isQuestType,
} from '@/lib/quests'
import { APP_TIME_ZONE_LABEL, toJakartaInputValue } from '@/lib/time'

export interface QuestRow {
  id: string
  title: string
  description: string
  points: number
  type?: QuestType
  achievementId: string | null
  availableFrom?: string | null
  availableUntil?: string | null
}

export interface AchievementOption {
  id: string
  name: string
}

const inputClass = `w-full bg-white border border-slate-300 rounded-md text-slate-800
  text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400`
const labelClass = 'text-xs font-medium text-slate-500 block mb-1'

export default function QuestForm({
  quest,
  achievements,
  quizQuestions,
  questionsFrozen,
}: {
  quest?: QuestRow
  achievements: AchievementOption[]
  quizQuestions?: QuestionDraft[]
  questionsFrozen?: boolean
}) {
  const isEdit = Boolean(quest)
  const questType: QuestType =
    quest?.type && isQuestType(quest.type) ? quest.type : 'qr'
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(!isEdit)
  const [createType, setCreateType] = useState<QuestType>('qr')
  const [pending, setPending] = useState(false)

  const showQuizPointsNote = isEdit ? questType === 'quiz' : createType === 'quiz'
  const showQrHelp = isEdit ? questType === 'qr' : createType === 'qr'

  if (isEdit && !open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-blue-600 hover:underline">
        Edit
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setPending(true)
        try {
          if (isEdit) await updateQuest(formData)
          else await createQuest(formData)
          formRef.current?.reset()
          if (isEdit) setOpen(false)
        } finally {
          setPending(false)
        }
      }}
      className="border border-slate-200 rounded-lg bg-white p-5 space-y-4"
    >
      {isEdit && <input type="hidden" name="id" value={quest!.id} />}

      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          {isEdit ? 'Edit quest' : 'New quest'}
        </h2>
        {isEdit && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {QUEST_TYPE_LABEL[questType]}
          </span>
        )}
      </div>

      {!isEdit && (
        <div>
          <label className={labelClass}>Type</label>
          <select
            name="type"
            value={createType}
            onChange={(e) => {
              const next = e.target.value
              setCreateType(isQuestType(next) ? next : 'qr')
            }}
            className={inputClass}
          >
            <option value="qr">QR — scan a printed code</option>
            <option value="submission">Submit — upload files for approval</option>
            <option value="quiz">Quiz — multiple-choice questions</option>
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={labelClass}>Title</label>
          <input
            name="title"
            required
            defaultValue={quest?.title}
            placeholder="Visit the club fair"
            className={inputClass}
          />
        </div>
        <div>
          {showQuizPointsNote ? (
            <>
              <label className={labelClass}>Points</label>
              <p className="text-sm text-slate-600 py-2">
                Sum of questions{isEdit ? `: ${quest?.points ?? 0}` : ''}
              </p>
            </>
          ) : (
            <>
              <label className={labelClass}>Points</label>
              <input
                name="points"
                type="number"
                min={1}
                required
                defaultValue={quest?.points ?? 10}
                className={inputClass}
              />
            </>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          name="description"
          required
          rows={2}
          defaultValue={quest?.description}
          placeholder="Talk to three club booths, then scan the QR at the info desk."
          className={inputClass}
        />
        <p className="text-xs text-slate-400 mt-1">
          Students see this before they complete the quest, so tell them where to
          go and what to do.
        </p>
      </div>

      <div>
        <label className={labelClass}>Grants achievement (optional)</label>
        <select
          name="achievementId"
          defaultValue={quest?.achievementId ?? ''}
          className={inputClass}
        >
          <option value="">None</option>
          {achievements.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {achievements.length === 0 && (
          <p className="text-xs text-slate-400 mt-1">
            No achievements exist yet — create one under Achievements first.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>
            Active Time Window Start ({APP_TIME_ZONE_LABEL}, optional)
          </label>
          <input
            name="availableFrom"
            type="datetime-local"
            defaultValue={toJakartaInputValue(quest?.availableFrom)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Active Time Window End ({APP_TIME_ZONE_LABEL}, optional)
          </label>
          <input
            name="availableUntil"
            type="datetime-local"
            defaultValue={toJakartaInputValue(quest?.availableUntil)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create quest'}
        </button>
        {isEdit ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        ) : showQrHelp ? (
          <p className="text-xs text-slate-500">
            New quests start inactive — generate and print the QR, then activate.
          </p>
        ) : createType === 'quiz' ? (
          <p className="text-xs text-slate-500">
            After creating, edit the quest to add quiz questions.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            New quests start inactive — activate when students can submit.
          </p>
        )}
      </div>

      {isEdit && questType === 'quiz' && quest && (
        <QuestQuestionEditor
          questId={quest.id}
          initial={quizQuestions ?? []}
          frozen={questionsFrozen ?? false}
        />
      )}
    </form>
  )
}
