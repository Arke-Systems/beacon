import type Payload from './Payload.js';

export default interface ProgressBar extends Disposable {
	increment(step?: number): void;
	update(payload: Omit<Payload, 'name'>): void;
}
