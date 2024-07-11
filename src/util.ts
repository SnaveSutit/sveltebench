import { ComponentConstructorOptions } from 'svelte'
import { type Writable, type Subscriber, type Unsubscriber, writable, get } from 'svelte/store'

export type SvelteComponentConstructor<T, U extends ComponentConstructorOptions> = new (
	options: U
) => T

type ValueValidator<T> = (value: T) => T

/**
 * A Writable store with a value validator, and a get method.
 */
export class Valuable<T> implements Writable<T> {
	static all: Array<Valuable<any>> = []

	private store: Writable<T>
	/**
	 * The value validator function. If the value is invalid, the validator should return a valid value.
	 */
	private valueValidator: ValueValidator<T>

	constructor(value: T, valueValidator?: ValueValidator<T>) {
		this.store = writable(value)
		this.valueValidator = valueValidator || ((value: T) => value)
		Valuable.all.push(this)
	}

	get() {
		return get(this.store)
	}

	set(value: T) {
		return this.store.set(this.valueValidator(value))
	}

	update(fn: (value: T) => T) {
		return this.store.update((value: T) => this.valueValidator(fn(value)))
	}

	subscribe(run: Subscriber<T>, invalidate?: (value?: T) => void): Unsubscriber {
		return this.store.subscribe(run, invalidate)
	}
}

/**
 * Returns a promise that resolves when the given resolver function returns a non-null value
 * @param resolver A function that returns a value or null
 * @param interval The interval in milliseconds to check the resolver function
 */
export function pollPromise<T = any>(resolver: () => T | undefined | null, interval?: 250) {
	return new Promise<T>(resolve => {
		const id = setInterval(() => {
			const result = resolver()
			if (result === null || result === undefined) return
			clearInterval(id)
			resolve(result)
		}, interval)
	})
}
