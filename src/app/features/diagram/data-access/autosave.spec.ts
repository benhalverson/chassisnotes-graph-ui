import { TestBed } from '@angular/core/testing';

import { Autosave } from './autosave';

describe('Autosave', () => {
  let service: Autosave;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Autosave);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should debounce repeated autosave requests by key', async () => {
    const task = vi.fn<() => void>();

    service.schedule('node:1', task, 300);
    service.schedule('node:1', task, 300);

    expect(service.hasPending('node:1')).toBe(true);

    await vi.advanceTimersByTimeAsync(299);
    expect(task).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(task).toHaveBeenCalledTimes(1);
    expect(service.hasPending('node:1')).toBe(false);
  });

  it('should cancel pending autosaves', async () => {
    const task = vi.fn<() => void>();

    service.schedule('edge:1', task, 300);
    service.cancel('edge:1');

    await vi.advanceTimersByTimeAsync(300);

    expect(task).not.toHaveBeenCalled();
    expect(service.hasPending('edge:1')).toBe(false);
  });
});
