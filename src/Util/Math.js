export const SimpleSin = class {
    constructor(A, k, b) {
        this.A = A;
        this.k = k;
        this.b = b;
        return this;
    }

    calc(x) {
        return Math.sin(this.k * x + this.b) * this.A;
    }
}

export const SimpleSinBuilder = class {
    setPeriod(number) {
        this.k = 2 * Math.PI / number;
        return this;
    }

    setAmplitude(number) {
        this.A = number;
        return this;
    }

    setPhase(number) {
        this.b = number;
        return this;
    }

    build() {
        return new SimpleSin(this.A, this.k, this.b)
    }
}


export const simpleCos = class  {
    constructor(A, k, b) {
        this.A = A;
        this.k = k;
        this.b = b;
        return this;
    }

    calc(x) {
        return Math.cos(this.k * x + this.b) * this.A;
    }
}

export const SimpleCosBuilder = class {
    setPeriod(number) {
        this.k = 2 * Math.PI / number;
        return this;
    }

    setAmplitude(number) {
        this.A = number;
        return this;
    }

    setPhase(number) {
        this.b = number;
        return this;
    }

    build() {
        return new simpleCos(this.A, this.k, this.b)
    }
}