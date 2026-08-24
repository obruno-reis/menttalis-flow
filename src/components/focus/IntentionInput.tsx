interface Props {
  value: string
  onChange: (value: string) => void
}

export function IntentionInput({ value, onChange }: Props) {
  return (
    <div className="w-full max-w-[420px]">
      <label htmlFor="intention" className="sr-only">
        Escreva aqui uma única tarefa.
      </label>
      <input
        id="intention"
        type="text"
        value={value}
        maxLength={80}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Escreva aqui uma única tarefa."
        autoComplete="off"
        className="intention-field w-full rounded-full px-5 py-3 text-center text-[15px] outline-none"
      />
    </div>
  )
}
