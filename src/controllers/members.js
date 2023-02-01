const { initializeMailgunClient } = require("../util/initializeClient");

const getMembers = async (req, res, mailingList) => {
  const client = initializeMailgunClient(req.session.apiKey);
  try {
    const members = await client.lists.members.listMembers(mailingList);
    return members;
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error });
  }
};

const addMembers = async (mailingList, members, client, res) => {
  console.log(members);
  try {
    const result = await client.lists.members.createMembers(mailingList, {
      members: members,
      upsert: "yes",
    });
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateMember = async (req, res) => {
  const client = initializeMailgunClient(req.session.apiKey);
  // Attempt to update member
  try {
    const updatedMember = await client.lists.members.updateMember(
      req.body.mailing_list,
      req.body.member_address,
      req.body.update_fields
    );
    return updatedMember;
  } catch (error) {
    res.status(400).send({ status: "Error", error: error });
  }
};
module.exports = { getMembers, addMembers, updateMember };
