import {
  getFamily,
  createFamilyInvitation,
  acceptFamilyInvitation,
  revokeFamilyInvitation
} from "../services/family.service.js";
import { sendFamilyInvitationEmail } from "../services/family-invitation-mail.js";

export async function getFamilyPage(req, res, next) {
  try {
    res.json({ status: "success", ...(await getFamily(req.userId)) });
  } catch (error) {
    next(error);
  }
}

export async function createInvitation(req, res, next) {
  try {
    const { token, expiresAt, recipient, inviter } = await createFamilyInvitation(
      req.userId,
      req.body?.email
    );

    const mailStatus = await sendFamilyInvitationEmail(recipient, token, inviter);
    res.status(201).json({ status: "success", token, expiresAt, mailStatus });
  } catch (error) {
    next(error);
  }
}

export async function acceptInvitation(req, res, next) {
  try {
    await acceptFamilyInvitation(req.userId, req.body?.token);
    res.json({ status: "success" });
  } catch (error) {
    next(error);
  }
}

export async function revokeInvitation(req, res, next) {
  try {
    await revokeFamilyInvitation(req.userId, req.params.id);
    res.json({ status: "success" });
  } catch (error) {
    next(error);
  }
}