import {
  getFamily,
  createFamilyInvitation,
  acceptFamilyInvitation,
  revokeFamilyInvitation
} from "../services/family.service.js";

export async function getFamilyPage(req, res, next) {
  try {
    res.json({ status: "success", ...(await getFamily(req.userId)) });
  } catch (error) {
    next(error);
  }
}

export async function createInvitation(req, res, next) {
  try {
    const invitation = await createFamilyInvitation(
      req.userId,
      req.body?.email
    );

    res.status(201).json({ status: "success", ...invitation });
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