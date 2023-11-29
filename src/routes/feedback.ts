import express, { Request, Response } from "express";
import { tokenVerify } from "@middleware/token";
import { Responser } from "@utils/ResponseController";
import HttpStatusCode from "@utils/httpStatus";
import axios from "axios";
import { GitHubIssuePath, GitHubIssueAuthorization } from "@config/config";
/*
 ************************************
 * _API /api/v1/feedback                *
 ************************************
 */

const router = express.Router();
/**
 * _POST submit GitHub issue
 * @Body string email - new email
 */
router.post("/", tokenVerify, async (_req: Request, _res: Response) => {
    //request preparation
    const { reportDate, version, label, contents } = _req.body;
    const body = new String(`datetime:${reportDate}\nversion:${version}\nuserID:${_req.profile.id}\ncontents:${contents}`);
    const issue = { title: "user report", labels: [label], body: body };
    const headers = { Accept: "application/vnd.github+json", Authorization: GitHubIssueAuthorization };
    const res = await axios
        .post(GitHubIssuePath, issue, { headers: headers })
        .then((res) => {
            return Responser(_res, HttpStatusCode.OK, "successful", { headers: headers });
        })
        .catch((err) => {
            return Responser(_res, HttpStatusCode.BAD_REQUEST, err, { headers: headers });
        });
});
export { router as feedbackRouter };
