class PerformanceMonitor {
    private static timers: Map<string, number> = new Map();

    static startTimer(label: string): void {
        this.timers.set(label, performance.now());
        console.log(`⏱️ Started: ${label}`);
    }

    static endTimer(label: string): number {
        const startTime = this.timers.get(label);
        if (!startTime) {
            console.warn(`Timer "${label}" was not started`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.timers.delete(label);
        console.log(`⏱️ Completed: ${label} in ${duration.toFixed(2)}ms`);
        return duration;
    }

    static async measureAsync<T>(label: string, asyncFn: () => Promise<T>): Promise<T> {
        this.startTimer(label);
        try {
            const result = await asyncFn();
            this.endTimer(label);
            return result;
        } catch (error) {
            this.endTimer(label);
            throw error;
        }
    }
}

export { PerformanceMonitor };