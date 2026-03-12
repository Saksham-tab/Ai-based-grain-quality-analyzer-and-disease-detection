export const validPayload = {
  temperature: 28.5,
  humidity: 62.1,
  moisture: 11.9,
  purity: 93.4,
  grade: "A",
  impurities: {
    husk: 1.2,
    stones: 0.4,
    blackSpots: 0.2,
    brokenPieces: 2.1,
    discolored: 1.3,
    insectDamage: 0.4,
  },
};

export const createMockResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return response;
};
