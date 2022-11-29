const { initializeMailgunClient } = require("../util/initializeClient");

const getMembers = async (req, res) => {
  const client = initializeMailgunClient(req.session.apiKey);
  try {
    const members = await client.lists.members.listMembers(
      req.body.mailing_list
    );
    return members;
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error });
  }
};

const addMembers = async (req, res) => {
  const client = initializeMailgunClient(req.body.apiKey);
  try {
    const members = await client.lists.members.createMembers(req.body.address, {
      members: req.body.members,
      upsert: "yes",
    });

    return members;
  } catch (error) {
    res.status(400).send({ status: "Error", error: error });
  }
};

module.exports = { getMembers, addMembers };
