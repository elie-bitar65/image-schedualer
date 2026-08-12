const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD;


/*
==================================================
CHECK ENVIRONMENT VARIABLES
==================================================
*/

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !ADMIN_PASSWORD
) {

  console.error(
    "Missing environment variables."
  );

  console.error(
    "Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD"
  );

  process.exit(1);

}


/*
==================================================
SUPABASE CONNECTION
==================================================
*/

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  );


/*
==================================================
EXPRESS CONFIGURATION
==================================================
*/

app.use(
  express.json({
    limit: "25mb"
  })
);

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);


/*
==================================================
PUBLIC API
GET /api/config

Returns:

- EPD configuration
- Base64 data
- Raw data in HEX
- Byte lengths
- Schedule
==================================================
*/

app.get(
  "/api/config",

  async (_req, res) => {

    try {

      /*
      Get saved configuration
      from Supabase
      */

      const {
        data,
        error
      } =
        await supabase
          .from("device_config")
          .select(
            "config,updated_at"
          )
          .eq(
            "id",
            1
          )
          .single();


      if (error) {

        throw error;

      }


      const config =
        data?.config || {};


      /*
      Start with all stored
      configuration values
      */

      const response = {

        ...config,

        updatedAt:
          data?.updated_at || null

      };


      /*
      ==================================================
      SINGLE IMAGE MODE

      Used for:
      - Black / White
      - Generic 7-color indexed mode

      config.image contains Base64.
      ==================================================
      */

      if (config.image) {

        /*
        Decode Base64 back into
        original binary EPD bytes
        */

        const rawBuffer =
          Buffer.from(
            config.image,
            "base64"
          );


        /*
        Base64 itself
        */

        response.imageBase64 =
          config.image;


        /*
        Number of characters
        in Base64 string
        */

        response.base64CharacterLength =
          config.image.length;


        /*
        Number of bytes occupied by
        Base64 text in UTF-8.

        Base64 uses ASCII characters,
        so normally this equals
        base64CharacterLength.
        */

        response.base64TextByteLength =
          Buffer.byteLength(
            config.image,
            "utf8"
          );


        /*
        Original EPD binary size
        after Base64 decoding
        */

        response.rawByteLength =
          rawBuffer.length;


        /*
        Confirmation of decoded
        Base64 byte length
        */

        response.base64DecodedByteLength =
          rawBuffer.length;


        /*
        Convert each raw EPD byte
        into hexadecimal.

        Example:

        FF
        00
        81
        42
        */

        response.rawDataHex =
          Array.from(
            rawBuffer
          ).map(

            byte =>

              byte
                .toString(16)
                .padStart(
                  2,
                  "0"
                )
                .toUpperCase()

          );


        /*
        Number of HEX bytes
        */

        response.rawDataHexCount =
          response
            .rawDataHex
            .length;

      }


      /*
      ==================================================
      COLORED EPD

      Generic dual-plane mode:

      - Black plane
      - Accent plane

      Accent can be:
      red
      yellow
      etc.
      ==================================================
      */

      if (config.blackPlane) {

        const blackBuffer =
          Buffer.from(
            config.blackPlane,
            "base64"
          );


        /*
        Black plane Base64
        */

        response.blackPlaneBase64 =
          config.blackPlane;


        /*
        Base64 string length
        */

        response.blackPlaneBase64CharacterLength =
          config.blackPlane.length;


        /*
        Base64 text byte length
        */

        response.blackPlaneBase64TextByteLength =
          Buffer.byteLength(
            config.blackPlane,
            "utf8"
          );


        /*
        Original black-plane
        raw byte length
        */

        response.blackPlaneRawByteLength =
          blackBuffer.length;


        /*
        Black-plane raw HEX
        */

        response.blackPlaneRawHex =
          Array.from(
            blackBuffer
          ).map(

            byte =>

              byte
                .toString(16)
                .padStart(
                  2,
                  "0"
                )
                .toUpperCase()

          );


        /*
        Number of HEX bytes
        */

        response.blackPlaneRawHexCount =
          response
            .blackPlaneRawHex
            .length;

      }


      /*
      ==================================================
      ACCENT COLOR PLANE
      ==================================================
      */

      if (config.accentPlane) {

        const accentBuffer =
          Buffer.from(
            config.accentPlane,
            "base64"
          );


        /*
        Accent plane Base64
        */

        response.accentPlaneBase64 =
          config.accentPlane;


        /*
        Base64 string length
        */

        response.accentPlaneBase64CharacterLength =
          config.accentPlane.length;


        /*
        Base64 text byte length
        */

        response.accentPlaneBase64TextByteLength =
          Buffer.byteLength(
            config.accentPlane,
            "utf8"
          );


        /*
        Raw accent-plane
        byte length
        */

        response.accentPlaneRawByteLength =
          accentBuffer.length;


        /*
        Accent plane raw HEX
        */

        response.accentPlaneRawHex =
          Array.from(
            accentBuffer
          ).map(

            byte =>

              byte
                .toString(16)
                .padStart(
                  2,
                  "0"
                )
                .toUpperCase()

          );


        /*
        Number of accent HEX bytes
        */

        response.accentPlaneRawHexCount =
          response
            .accentPlaneRawHex
            .length;

      }


      /*
      ==================================================
      TOTAL RAW BYTE LENGTH

      Useful for colored dual-plane
      EPD debugging.
      ==================================================
      */

      if (
        response.blackPlaneRawByteLength
        ||
        response.accentPlaneRawByteLength
      ) {

        response.totalRawByteLength =

          (
            response.blackPlaneRawByteLength
            || 0
          )

          +

          (
            response.accentPlaneRawByteLength
            || 0
          );

      }


      /*
      Return complete API response
      */

      res.json(
        response
      );

    }


    catch (err) {

      console.error(
        "GET /api/config:",
        err
      );


      res
        .status(500)
        .json({

          error:
            "Could not load configuration."

        });

    }

  }
);


/*
==================================================
SAVE API

POST /api/save

Protected with admin password.
==================================================
*/

app.post(
  "/api/save",

  async (req, res) => {

    try {

      /*
      Read admin password
      from HTTP header
      */

      const suppliedPassword =
        req.get(
          "x-admin-password"
        );


      /*
      Check password
      */

      if (
        suppliedPassword
        !==
        ADMIN_PASSWORD
      ) {

        return res
          .status(401)
          .json({

            error:
              "Wrong admin password."

          });

      }


      /*
      Read configuration
      sent from website
      */

      const config =
        req.body?.config;


      if (
        !config
        ||
        typeof config
        !== "object"
      ) {

        return res
          .status(400)
          .json({

            error:
              "Missing config object."

          });

      }


      /*
      Validate display dimensions
      */

      if (
        !Number.isInteger(
          config.width
        )
        ||
        !Number.isInteger(
          config.height
        )
        ||
        config.width < 1
        ||
        config.height < 1
      ) {

        return res
          .status(400)
          .json({

            error:
              "Invalid display dimensions."

          });

      }


      /*
      Validate schedule
      */

      if (
        !Array.isArray(
          config.schedule
        )
      ) {

        return res
          .status(400)
          .json({

            error:
              "Schedule must be an array."

          });

      }


      /*
      Only allow HH:MM times
      from 00:00 to 23:59
      */

      const allowedTime =
        /^([01]\d|2[0-3]):[0-5]\d$/;


      /*
      Remove invalid times,
      duplicates,
      then sort
      */

      config.schedule =

        [
          ...new Set(

            config.schedule.filter(

              time =>

                typeof time
                  ===
                "string"

                &&

                allowedTime.test(
                  time
                )

            )

          )
        ].sort();


      /*
      Save configuration
      into Supabase
      */

      const {
        error
      } =
        await supabase
          .from(
            "device_config"
          )
          .upsert(

            {

              id: 1,

              config:
                config,

              updated_at:
                new Date()
                  .toISOString()

            },

            {
              onConflict:
                "id"
            }

          );


      if (error) {

        throw error;

      }


      /*
      Return success
      */

      res.json({

        ok: true,

        schedule:
          config.schedule

      });

    }


    catch (err) {

      console.error(
        "POST /api/save:",
        err
      );


      res
        .status(500)
        .json({

          error:
            "Could not save configuration."

        });

    }

  }
);


/*
==================================================
START SERVER
==================================================
*/

app.listen(
  PORT,

  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);
