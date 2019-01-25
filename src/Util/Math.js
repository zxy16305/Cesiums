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


export const simpleCos = class {
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

/// <summary>
/// 求一条直线与平面的交点
/// </summary>
/// <param name="planeVector">平面的法线向量，长度为3</param>
/// <param name="planePoint">平面经过的一点坐标，长度为3</param>
/// <param name="lineVector">直线的方向向量，长度为3</param>
/// <param name="linePoint">直线经过的一点坐标，长度为3</param>
/// <returns>返回交点坐标，长度为3</returns>
export const CalPlaneLineIntersectPoint = (planeVector, planePoint, lineVector, linePoint) => {
    let returnResult = [];
    let vp1, vp2, vp3, n1, n2, n3, v1, v2, v3, m1, m2, m3, t, vpt;
    vp1 = planeVector[0];
    vp2 = planeVector[1];
    vp3 = planeVector[2];
    n1 = planePoint[0];
    n2 = planePoint[1];
    n3 = planePoint[2];
    v1 = lineVector[0];
    v2 = lineVector[1];
    v3 = lineVector[2];
    m1 = linePoint[0];
    m2 = linePoint[1];
    m3 = linePoint[2];
    vpt = v1 * vp1 + v2 * vp2 + v3 * vp3;
    //首先判断直线是否与平面平行
    if (vpt === 0) {
        returnResult = null;
    }
    else {
        t = ((n1 - m1) * vp1 + (n2 - m2) * vp2 + (n3 - m3) * vp3) / vpt;
        returnResult[0] = m1 + v1 * t;
        returnResult[1] = m2 + v2 * t;
        returnResult[2] = m3 + v3 * t;
    }
    return returnResult;
}
/**
 * 计算两线的公垂线 参数均为[x,y,x]
 * @constructor
 */
export const CalcTwoLineCommonVert = ([vector1X, vector1Y, vector1Z], [point1X, point1Y, point1Z],
                                      [vector2X, vector2Y, vector2Z], [point2X, point2Y, point2Z]) => {
    //公垂线
    let [vectorCommonX, vectorCommonY, vectorCommonZ] = [
        vector1Y * vector2Z - vector2Y * vector1Z,
        -(vector1X * vector2Z - vector2X * vector1Z),
        vector1X * vector2Y - vector2X * vector1Y
    ]

}

export const CalcTwoLineCommonVertByFourPoints = ([point1X, point1Y, point1Z], [point2X, point2Y, point2Z],
                                                  [point3X, point3Y, point3Z], [point4X, point4Y, point4Z]) => {
    let H = point2X - point1X, I = point2Y - point1Y, J = point2Z - point1Z,
        K = point4X - point3X, L = point4Y - point3Y, M = point4Z - point3Z;
    let N = H * I * L - I * I * K - J * J * K + H * J * M;
    let O = H * H * L - H * I * K - I * J * M + J * J * L;
    let P = H * J * K - H * H * M - I * I * M + I * J * L;
    let Q = -point1X * N + point1Y * O - point1Z * P;
    let common = [-Q / N, Q / O, -Q / P]//公垂线
    let k = (O * point3Y - N * point3X - P * point3Z - Q) / (N * K - O * L + P * M)

    return [K * k + point3X, L * k + point3Y, M * k + point3Z]

}

