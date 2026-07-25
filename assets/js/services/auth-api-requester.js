import { ApiRequester } from "./base-api-requester.js";

const TIMER = 15000;

export class AuthApiRequester extends ApiRequester {
  constructor() {
    super();
  }

  static async verifyLogin() {
    const instance = this.getInstance();

    const options = {
      timer: TIMER,
    };

    const { json: res } = await instance.sendRequest(
      "auth/login/verify",
      "GET",
      undefined,
      options,
    );

    if (
      res.result === "error" &&
      res.errors &&
      res.errors.some((e) => e.cd === "COM3002" || e.cd === "COM3005")
    ) {
      return (
        await instance.sendRequest(
          "auth/login/verify",
          "GET",
          undefined,
          options,
        )
      ).json;
    } else {
      return res;
    }
  }
}
