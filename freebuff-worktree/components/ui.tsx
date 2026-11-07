"use client";

import { useId, type ReactNode } from "react";
import type { Option } from "@/lib/profile/options";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  why?: string;
  optional?: boolean;
  children: ReactNode;
}

function FieldShell({ id, label, hint, why, optional, children }: FieldShellProps) {
  return (
    <div className="field">
      <div className="field__head">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {optional ? <span className="field__optional">Optional</span> : null}
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
      {children}
      {why ? (
        <p className="why">
          <span className="why__mark" aria-hidden="true">
            ?
          </span>
          <span>{why}</span>
        </p>
      ) : null}
    </div>
  );
}

interface BaseFieldProps {
  label: string;
  hint?: string;
  why?: string;
  optional?: boolean;
}

export function TextField({
  label,
  hint,
  why,
  optional,
  value,
  onChange,
  placeholder,
  type = "text",
}: BaseFieldProps & {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} why={why} optional={optional}>
      <input
        id={id}
        className="input"
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value)}
      />
    </FieldShell>
  );
}

export function MoneyField({
  label,
  hint,
  why,
  optional,
  value,
  onChange,
  placeholder,
}: BaseFieldProps & {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} why={why} optional={optional}>
      <div className="input-affix">
        <span className="input-affix__prefix" aria-hidden="true">
          $
        </span>
        <input
          id={id}
          className="input input--affixed"
          type="number"
          min={0}
          step={50}
          inputMode="numeric"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === "" ? undefined : Math.max(0, Number(raw)));
          }}
        />
      </div>
    </FieldShell>
  );
}

export function NumberField({
  label,
  hint,
  why,
  optional,
  value,
  onChange,
  placeholder,
  suffix,
  max,
}: BaseFieldProps & {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  suffix?: string;
  max?: number;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} why={why} optional={optional}>
      <div className="input-affix input-affix--suffix">
        <input
          id={id}
          className="input input--affixed"
          type="number"
          min={0}
          max={max}
          step={1}
          inputMode="numeric"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(event) => {
            const raw = event.target.value;
            onChange(raw === "" ? undefined : Math.max(0, Number(raw)));
          }}
        />
        {suffix ? (
          <span className="input-affix__suffix" aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  label,
  hint,
  why,
  optional,
  value,
  onChange,
  options,
  placeholder = "Choose one",
}: BaseFieldProps & {
  value?: T;
  onChange: (value: T | undefined) => void;
  options: Option<T>[];
  placeholder?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} why={why} optional={optional}>
      <select
        id={id}
        className="select"
        value={value ?? ""}
        onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function ChoiceField<T extends string>({
  label,
  hint,
  why,
  optional,
  value,
  onChange,
  options,
  columns = 2,
}: BaseFieldProps & {
  value?: T;
  onChange: (value: T | undefined) => void;
  options: Option<T>[];
  columns?: 1 | 2 | 3;
}) {
  return (
    <div className="field">
      <div className="field__head">
        <span className="field__label">{label}</span>
        {optional ? <span className="field__optional">Optional</span> : null}
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
      <div className={`option-grid option-grid--${columns}`} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`option${selected ? " option--selected" : ""}`}
              onClick={() => onChange(selected ? undefined : option.value)}
            >
              <span className="option__label">{option.label}</span>
              {option.description ? <span className="option__desc">{option.description}</span> : null}
            </button>
          );
        })}
      </div>
      {why ? (
        <p className="why">
          <span className="why__mark" aria-hidden="true">
            ?
          </span>
          <span>{why}</span>
        </p>
      ) : null}
    </div>
  );
}

export function MultiChoiceField<T extends string>({
  label,
  hint,
  why,
  optional,
  values,
  onChange,
  options,
  columns = 2,
}: BaseFieldProps & {
  values: T[];
  onChange: (values: T[]) => void;
  options: Option<T>[];
  columns?: 1 | 2 | 3;
}) {
  const toggle = (value: T) => {
    onChange(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]);
  };
  return (
    <div className="field">
      <div className="field__head">
        <span className="field__label">{label}</span>
        {optional ? <span className="field__optional">Optional</span> : null}
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
      <div className={`option-grid option-grid--${columns}`} role="group" aria-label={label}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className={`option${selected ? " option--selected" : ""}`}
              onClick={() => toggle(option.value)}
            >
              <span className="option__check" aria-hidden="true">
                {selected ? "✓" : ""}
              </span>
              <span className="option__label">{option.label}</span>
              {option.description ? <span className="option__desc">{option.description}</span> : null}
            </button>
          );
        })}
      </div>
      {why ? (
        <p className="why">
          <span className="why__mark" aria-hidden="true">
            ?
          </span>
          <span>{why}</span>
        </p>
      ) : null}
    </div>
  );
}

export function YesNoField({
  label,
  hint,
  why,
  optional,
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
  unsure = true,
}: BaseFieldProps & {
  value?: boolean;
  onChange: (value: boolean | undefined) => void;
  yesLabel?: string;
  noLabel?: string;
  unsure?: boolean;
}) {
  return (
    <div className="field">
      <div className="field__head">
        <span className="field__label">{label}</span>
        {optional ? <span className="field__optional">Optional</span> : null}
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
      <div className="segmented" role="radiogroup" aria-label={label}>
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          className={value === true ? "segmented__item segmented__item--on" : "segmented__item"}
          onClick={() => onChange(value === true ? undefined : true)}
        >
          {yesLabel}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          className={value === false ? "segmented__item segmented__item--on" : "segmented__item"}
          onClick={() => onChange(value === false ? undefined : false)}
        >
          {noLabel}
        </button>
        {unsure ? (
          <button
            type="button"
            role="radio"
            aria-checked={value === undefined}
            className={value === undefined ? "segmented__item segmented__item--on" : "segmented__item"}
            onClick={() => onChange(undefined)}
          >
            Not sure
          </button>
        ) : null}
      </div>
      {why ? (
        <p className="why">
          <span className="why__mark" aria-hidden="true">
            ?
          </span>
          <span>{why}</span>
        </p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  why,
  optional,
  value,
  onChange,
  placeholder,
  rows = 3,
}: BaseFieldProps & {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} why={why} optional={optional}>
      <textarea
        id={id}
        className="textarea"
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value)}
      />
    </FieldShell>
  );
}
